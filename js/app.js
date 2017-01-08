(function() {

  var squares = document.querySelectorAll('#board li');
  var movesCounter = 0;
  var won = false;
  var boardState = [];
  var lockPlay = false;

  // Represents the possible win states in the game.
  var winStates = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];

  /**
   * Keep a count of the moves required by each player to reach every win state.
   * At the start each player is 3 moves away from winning.
   * When a player captures a position, we decrease the count for the corresponding win states.
   * Those win states become unavailable to the other player, so we set them to null.
   */
  var playerProgress = {
    x: [3, 3, 3, 3, 3, 3, 3, 3],
    o: [3, 3, 3, 3, 3, 3, 3, 3]
  };

    /**
     * Maps board positions to the win states they belong to,
     * For example, position 0 belongs to win state 0, 3 and 6.
     */
  var winStateMap = {
    0: [0, 3, 6],
    1: [0, 4],
    2: [0, 5, 7],
    3: [1, 3],
    4: [1, 4, 6, 7],
    5: [1, 5],
    6: [2, 3, 7],
    7: [2, 4],
    8: [2, 5, 6]
  };

  function resetGame() {

    for (var i=0; i<9; i++) {
      boardState[i] = null;
    }
    // @todo: reset playerProgress and classes.
  }


  /**
   * Determines the
   */
  function getOpposingPlayer(player) {
    return player === 'x' ? 'o' : 'x';
  }


  /**
   * Builds and returns an object containing:
   * Rankings for positions, from 0 - 4 (the number of win states they contribute to)
   * Risk for positions, from 0 - 2, where 0 is no risk, 2 is immediate danger.
   */
  function rankMovesForPlayer(player) {

    // Order the available win states by the number of moves required to complete.
    // This is 1, 2 or 3, but to make things easier we use array indexes 0, 1, 2 (i.e. moves - 1).
    var availableWinStates = [[], [], []];

    // The positions will be ranked on how many available win states they contribute to.
    var positionRank = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    // The risk to the opponent is determined by how many moves the player is away from winning.
    var opponentRisk = [0, 0, 0, 0, 0, 0, 0, 0, 0];

    // Loop through the possible win states (there are always 8).
    for (var winStateId = 0; winStateId < 8; winStateId++) {
      // Skip win states unavailable to the player.
      if (playerProgress[player][winStateId] === null) {
        continue;
      }
      // Add it to the list of available win states, in ordered by remaining plays.
      var movesRemaining = playerProgress[player][winStateId];
      availableWinStates[movesRemaining - 1].push(winStateId);
    }

    // Loop through the groups of win states, from least plays, to most.
    for (var requiredPlays = 0; requiredPlays < 3; requiredPlays++) {
      // There are no win states with this number of turns, move on.
      if (availableWinStates[requiredPlays].length === 0) {
        continue;
      }
      // Determine the position that appears in the most win states.
      for (var i = 0; i < availableWinStates[requiredPlays].length; i++) {
        winStateId = availableWinStates[requiredPlays][i];
        // console.log(winStates[winStateId]);
        for (var j = 0; j < 3; j++) {
          // Only count positions that are available.
          if (boardState[winStates[winStateId][j]] === null) {
            positionRank[winStates[winStateId][j]]++;
            opponentRisk[winStates[winStateId][j]] = 2 - requiredPlays;
          }
        }
      }
      break;
    }
    return {rank: positionRank, opponentRisk: opponentRisk};
  }


  /**
   * Combines rankings and risk to determine the best move for a player.
   */
  function getBestMove(player) {

    var playerMoves = rankMovesForPlayer(player);
    var opponentMoves = rankMovesForPlayer(getOpposingPlayer(player));

    // We can win the game if the risk to our opponent is at 2.
    for (var position = 0; position < 9; position++) {
      if (playerMoves.opponentRisk[position] === 2) {
        return position;
      }
    }

    // Now the inverse, we must block if the risk to us is 2.
    for (position = 0; position < 9; position++) {
      if (opponentMoves.opponentRisk[position] === 2) {
        return position;
      }
    }

    // Add 1 to the rank of all playable positions, so we always have a move,
    // even when there is no preference for any given one (i.e. the game is already a draw).
    for (position = 0; position < 9; position++) {
      if (boardState[position] === null) {
        playerMoves.rank[position]++;
      }
    }

    // Out of the ranked positions, find the highest one.
    var maxWins = 0;
    var bestMove = null;
    for (position = 0; position < 9; position++) {
      if (playerMoves.rank[position] > maxWins) {
        maxWins = playerMoves.rank[position];
        bestMove = position;
      }
    }
    return bestMove;
  }


  /**
   * Determines if the requested move is valid
   *
   * @param  int  position
   *   The position requested by the player.
   * @return Boolean
   *   True if the position is valid, false otherwise.
   */
  function isMoveValid(position) {
    return boardState[position] === null;
  }


  function markPosition(player, position) {
    squares[position].className = player;
  }


  function makeMove(player, position) {
    if (!isMoveValid(position)) {
      return false;
    }

    var opponent = (player === 'x' ? 'o' : 'x');

    movesCounter++;
    boardState[position] = player;
    markPosition(player, position);

    // For every win state this position belongs to.
    for (var winStateId = 0; winStateId < winStateMap[position].length; winStateId++) {

      // These win states are no longer open to the opposing player.
      playerProgress[opponent][winStateMap[position][winStateId]] = null;


      // That win state was already eliminated.
      if (playerProgress[player][winStateMap[position][winStateId]] === null) {
        continue;
      }

      // The current player has moved one step closer to winning by that state.
      // Remove 1 from the count.
      if (--playerProgress[player][winStateMap[position][winStateId]] === 0) {
        won = true;
        setTimeout(function() { alert('Player ' + player + ' wins!'); }, 200);
        return false;
      }
    }

    // The move was made.
    return true;
  }

  resetGame();

  function playerCanMove() {
    return movesCounter % 2 === 0 && !lockPlay;
  }

  function computerMove() {

    var bestPlay = getBestMove('o');

    if (bestPlay !== null) {
      makeMove('o', bestPlay);
      lockPlay = false;
    }
  }

  for (var i=0; i<squares.length; i++) {
    squares[i].onclick = (function(position) {
      return function () {
        if (won) {
          return;
        }

        if (!playerCanMove()) {
          return;
        }

        // Make human move, and if successful, ask computer to move.
        if (makeMove('x', position)) {
          // Prevent user input during computer turn.
          lockPlay = true;
          setTimeout(computerMove, 400);
        }
      };
    })(i);
  }
})();
